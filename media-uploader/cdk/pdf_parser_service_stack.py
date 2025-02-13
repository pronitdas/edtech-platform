import aws_cdk as cdk
from aws_cdk import (
    aws_ecr as ecr,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
)
from constructs import Construct

class PdfParserServiceStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create an ECR repository for your Docker image.
        repository = ecr.Repository(self, "PdfParserRepository",
                                    repository_name="pdf-parser-api")

        # Create a VPC to run the ECS cluster.
        vpc = ec2.Vpc(self, "Vpc", max_azs=2)

        # Create an ECS cluster.
        cluster = ecs.Cluster(self, "Cluster", vpc=vpc)

        # Create an ECS Fargate service with an Application Load Balancer.
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "PdfParserFargateService",
            cluster=cluster,
            cpu=256,
            memory_limit_mib=512,
            desired_count=1,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_ecr_repository(repository),
                container_port=8000,
            ),
            public_load_balancer=True
        )

        cdk.CfnOutput(self, "RepositoryURI", value=repository.repository_uri)
        cdk.CfnOutput(self, "LoadBalancerDNS", value=fargate_service.load_balancer.load_balancer_dns_name) 